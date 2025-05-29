import { KeywordGroup, Keyword, KeywordInput, KeywordResponse, KeywordFilter, PaginationParams, SortParams, KeywordGroupTreeData, CampaignTreeItem } from '../types';
import { CAMPAIGNS, getCampaignByName } from '../../../config/campaign.config';

// Supabase 클라이언트 가져오기
import { supabase } from '../../../supabase';

// 키워드 그룹 관련 서비스
export const keywordGroupService = {
  // 사용자의 모든 키워드 그룹 가져오기
  async getUserGroups(): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      const { data, error } = await supabase
        .from('keyword_groups')
        .select(`
          id,
          user_id,
          name,
          campaign_name,
          campaign_type,
          is_default,
          created_at,
          updated_at,
          keywords(count)
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 변환
      const transformedData = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        campaignName: item.campaign_name,
        campaignType: item.campaign_type,
        isDefault: item.is_default,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        keywordCount: item.keywords?.[0]?.count || 0
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  // 그룹의 키워드 수 조회
  async getKeywordCountByGroup(groupId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 그룹이 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 키워드 수 카운트
      const { count, error } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (error) throw error;

      return {
        success: true,
        data: { count: count || 0 }
      };
    } catch (error) {

      return {
        success: false,
        message: '키워드 수를 조회하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 그룹 트리 데이터 조회 함수
  async getKeywordGroupTree(): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 사용자의 모든 그룹 조회
      const { data: groups, error } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 변환
      const transformedGroups = groups.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        campaignName: item.campaign_name,
        campaignType: item.campaign_type,
        isDefault: item.is_default,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      // 기본 그룹 별도 분리
      const defaultGroup = transformedGroups.find(g => g.isDefault) || null;
      
      // 캠페인에 속하지 않은 일반 그룹들 (기본 그룹 제외)
      const generalGroups = transformedGroups.filter(g => !g.campaignName && !g.isDefault);
      
      // 캠페인별 그룹 구성
      const campaignGroups = transformedGroups.filter(g => g.campaignName && g.campaignType);
      
      // 캠페인 트리 구성
      const campaignMap = new Map<string, CampaignTreeItem>();
      
      // Config에 정의된 모든 캠페인 먼저 초기화
      CAMPAIGNS.forEach(campaign => {
        campaignMap.set(campaign.name, {
          name: campaign.name,
          logo: campaign.logo,
          types: campaign.types.map(type => ({
            name: type.name,
            code: type.code,
            groups: []
          }))
        });
      });
      
      // 각 그룹을 해당 캠페인/유형에 할당
      campaignGroups.forEach(group => {
        if (group.campaignName && group.campaignType) {
          const campaignNode = campaignMap.get(group.campaignName);

          if (campaignNode) {
            const typeNode = campaignNode.types.find(t => t.code === group.campaignType);
            if (typeNode) {
              typeNode.groups.push(group);
            }
          }
        }
      });
      
      // 모든 캠페인/유형 포함 (빈 그룹도 표시)
      const campaigns = Array.from(campaignMap.values());
      
      const result: KeywordGroupTreeData = {
        campaigns,
        defaultGroup,
        generalGroups
      };

      return { success: true, data: result };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹 트리를 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  // 새 키워드 그룹 생성
  async createGroup(
    name: string, 
    campaignName: string | null = null, 
    campaignType: string | null = null, 
    isDefault: boolean = false
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 캠페인 정보 검증
      if (campaignName && campaignType) {
        // 캠페인이 config에 있는지 확인
        const campaign = getCampaignByName(campaignName);
        if (!campaign) {
          return {
            success: false,
            message: '유효하지 않은 캠페인입니다.',
          };
        }

        // 캠페인에 해당 유형이 있는지 확인
        const hasType = campaign.types.some(t => t.code === campaignType);
        if (!hasType) {
          return {
            success: false,
            message: '유효하지 않은 캠페인 유형입니다.',
          };
        }
      } else if (campaignName || campaignType) {
        // 둘 중 하나만 있는 경우 오류
        return {
          success: false,
          message: '캠페인 이름과 유형은 모두 입력하거나 모두 입력하지 않아야 합니다.',
        };
      }

      // 기본 그룹 생성 허용 - 각 서비스별 기본 그룹 자동 생성을 위해

      // 새 그룹 생성
      const { data, error } = await supabase
        .from('keyword_groups')
        .insert([
          { 
            user_id: user.id, 
            name,
            campaign_name: campaignName,
            campaign_type: campaignType, 
            is_default: isDefault 
          },
        ])
        .select('*');

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 변환
      const transformedData = {
        id: data[0].id,
        userId: data[0].user_id,
        name: data[0].name,
        campaignName: data[0].campaign_name,
        campaignType: data[0].campaign_type,
        isDefault: data[0].is_default,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 생성하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 기본 그룹 가져오기 또는 생성 - 제거됨
  // 사용자가 직접 그룹을 생성해야 함

  // 키워드 그룹 업데이트
  async updateGroup(
    groupId: number, 
    name: string, 
    campaignName: string | null = null, 
    campaignType: string | null = null
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 캠페인 정보 검증
      if (campaignName && campaignType) {
        // 캠페인이 config에 있는지 확인
        const campaign = getCampaignByName(campaignName);
        if (!campaign) {
          return {
            success: false,
            message: '유효하지 않은 캠페인입니다.',
          };
        }

        // 캠페인에 해당 유형이 있는지 확인
        const hasType = campaign.types.some(t => t.code === campaignType);
        if (!hasType) {
          return {
            success: false,
            message: '유효하지 않은 캠페인 유형입니다.',
          };
        }
      } else if (campaignName || campaignType) {
        // 둘 중 하나만 있는 경우 오류
        return {
          success: false,
          message: '캠페인 이름과 유형은 모두 입력하거나 모두 입력하지 않아야 합니다.',
        };
      }

      // 그룹 소유권 확인
      const { data: groupData, error: checkError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 그룹 수정
      const { data, error } = await supabase
        .from('keyword_groups')
        .update({ 
          name, 
          campaign_name: campaignName,
          campaign_type: campaignType,
          updated_at: new Date().toISOString() 
        })
        .eq('id', groupId)
        .eq('user_id', user.id)
        .select('*');

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 변환
      const transformedData = {
        id: data[0].id,
        userId: data[0].user_id,
        name: data[0].name,
        campaignName: data[0].campaign_name,
        campaignType: data[0].campaign_type,
        isDefault: data[0].is_default,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 업데이트하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 그룹 삭제
  async deleteGroup(groupId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 그룹 소유권 확인
      const { data: groupData, error: checkError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 그룹에 속한 키워드도 삭제됨 (CASCADE 제약조건)
      const { error } = await supabase
        .from('keyword_groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 삭제하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 이동
  async moveKeywords(
    keywordIds: number[],
    targetGroupId: number
  ): Promise<KeywordResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 대상 그룹이 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', targetGroupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 키워드들의 그룹 ID 업데이트
      const { error } = await supabase
        .from('keywords')
        .update({ group_id: targetGroupId })
        .in('id', keywordIds);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: '키워드를 이동하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 복사
  async copyKeywords(
    keywordIds: number[],
    targetGroupId: number
  ): Promise<KeywordResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 대상 그룹이 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', targetGroupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 원본 키워드들 가져오기
      const { data: keywords, error: fetchError } = await supabase
        .from('keywords')
        .select('*')
        .in('id', keywordIds);

      if (fetchError) throw fetchError;

      // 키워드 복사
      const keywordsToCopy = keywords.map(kw => ({
        group_id: targetGroupId,
        main_keyword: kw.main_keyword,
        mid: kw.mid,
        url: kw.url,
        keyword1: kw.keyword1,
        keyword2: kw.keyword2,
        keyword3: kw.keyword3,
        description: kw.description,
        is_active: kw.is_active
      }));

      const { error: insertError } = await supabase
        .from('keywords')
        .insert(keywordsToCopy);

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: '키워드를 복사하는 중 오류가 발생했습니다.',
      };
    }
  },
};

// 키워드 관련 서비스
export const keywordService = {
  // 그룹의 모든 키워드 가져오기
  async getKeywordsByGroup(
    groupId: number,
    filter?: KeywordFilter,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 먼저 그룹이 현재 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('id') // 필요한 필드만 선택
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 필요한 필드만 선택하여 네트워크 부하 감소
      let query = supabase
        .from('keywords')
        .select(`
          id,
          group_id,
          main_keyword,
          mid,
          url,
          keyword1,
          keyword2,
          keyword3,
          description,
          is_active,
          created_at,
          updated_at
        `, { count: 'exact' });

      // 그룹 ID 필터
      query = query.eq('group_id', groupId);

      // 검색어 필터
      if (filter?.search) {
        query = query.or(
          `main_keyword.ilike.%${filter.search}%,keyword1.ilike.%${filter.search}%,keyword2.ilike.%${filter.search}%,keyword3.ilike.%${filter.search}%`
        );
      }

      // 활성 상태 필터
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }

      // 정렬
      if (sort) {
        // 클라이언트에서는 스네이크 케이스로 직접 필드명을 넘겨주기로 했으니 그대로 사용
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션
      if (pagination) {
        const { page, limit } = pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data.map(item => ({
        id: item.id,
        groupId: item.group_id,
        mainKeyword: item.main_keyword,
        mid: item.mid,
        url: item.url,
        keyword1: item.keyword1,
        keyword2: item.keyword2,
        keyword3: item.keyword3,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return {
        success: true,
        data: {
          keywords: transformedData,
          total: count
        }
      };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  // 새 키워드 추가
  async createKeyword(
    groupId: number, 
    keywordData: KeywordInput,
    keywordType?: 'shop' | 'place'
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      if (!groupId) {
        return {
          success: false,
          message: '키워드를 추가할 그룹을 선택해주세요.',
        };
      }

      // 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 삽입할 데이터 준비
      const insertData = {
        group_id: groupId,
        main_keyword: keywordData.mainKeyword.substring(0, 100), // 최대 100자
        mid: keywordData.mid ? Number(keywordData.mid) : null,  // 숫자로 변환하거나 null
        url: keywordData.url ? keywordData.url.substring(0, 500) : null, // 최대 500자
        keyword1: keywordData.keyword1 ? keywordData.keyword1.substring(0, 100) : null,
        keyword2: keywordData.keyword2 ? keywordData.keyword2.substring(0, 100) : null,
        keyword3: keywordData.keyword3 ? keywordData.keyword3.substring(0, 100) : null,
        description: keywordData.description || null,
        is_active: keywordData.isActive !== undefined ? keywordData.isActive : true,
        additional_info: keywordData.additionalInfo || null  // JSON 형태로 저장
      };

      const { data, error } = await supabase
        .from('keywords')
        .insert([insertData])
        .select('*');

      if (error) {
        // 409 Conflict - 중복 키 에러 처리
        if (error.code === '23505') {  // PostgreSQL unique violation
          const idType = keywordType === 'place' ? 'PID' : 'MID';
          return {
            success: false,
            message: `이미 동일한 키워드와 ${idType} 조합이 존재합니다.`
          };
        }
        throw error;
      }

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = {
        id: data[0].id,
        groupId: data[0].group_id,
        mainKeyword: data[0].main_keyword,
        mid: data[0].mid,
        url: data[0].url,
        keyword1: data[0].keyword1,
        keyword2: data[0].keyword2,
        keyword3: data[0].keyword3,
        description: data[0].description,
        isActive: data[0].is_active,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 생성하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 업데이트
  async updateKeyword(
    keywordId: number, 
    updateData: Partial<Keyword>
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 해당 키워드가 사용자의 그룹에 속해 있는지 확인
      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .select(`
          *, 
          keyword_groups!inner(*)
        `)
        .eq('id', keywordId)
        .eq('keyword_groups.user_id', user.id)
        .single();

      if (keywordError) {
        return {
          success: false,
          message: '해당 키워드에 접근할 권한이 없습니다.',
        };
      }

      // 스네이크 케이스로 변환
      const snakeCaseData: any = {};
      
      if (updateData.mainKeyword !== undefined) snakeCaseData.main_keyword = updateData.mainKeyword;
      if (updateData.mid !== undefined) snakeCaseData.mid = updateData.mid;
      if (updateData.url !== undefined) snakeCaseData.url = updateData.url;
      if (updateData.keyword1 !== undefined) snakeCaseData.keyword1 = updateData.keyword1;
      if (updateData.keyword2 !== undefined) snakeCaseData.keyword2 = updateData.keyword2;
      if (updateData.keyword3 !== undefined) snakeCaseData.keyword3 = updateData.keyword3;
      if (updateData.description !== undefined) snakeCaseData.description = updateData.description;
      if (updateData.isActive !== undefined) snakeCaseData.is_active = updateData.isActive;
      
      snakeCaseData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('keywords')
        .update(snakeCaseData)
        .eq('id', keywordId)
        .select('*');

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = {
        id: data[0].id,
        groupId: data[0].group_id,
        mainKeyword: data[0].main_keyword,
        mid: data[0].mid,
        url: data[0].url,
        keyword1: data[0].keyword1,
        keyword2: data[0].keyword2,
        keyword3: data[0].keyword3,
        description: data[0].description,
        isActive: data[0].is_active,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 업데이트하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 삭제
  async deleteKeyword(keywordId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 해당 키워드가 사용자의 그룹에 속해 있는지 확인
      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .select(`
          *, 
          keyword_groups!inner(*)
        `)
        .eq('id', keywordId)
        .eq('keyword_groups.user_id', user.id)
        .single();

      if (keywordError) {
        return {
          success: false,
          message: '해당 키워드에 접근할 권한이 없습니다.',
        };
      }

      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 삭제하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 대량 추가
  async bulkCreateKeywords(
    groupId: number, 
    keywordsData: KeywordInput[]
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      if (!groupId) {
        return {
          success: false,
          message: '키워드를 추가할 그룹을 선택해주세요.',
        };
      }

      // 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      if (keywordsData.length === 0) {
        return {
          success: false,
          message: '추가할 키워드가 없습니다.',
        };
      }

      const keywordsToInsert = keywordsData.map(kw => ({
        group_id: groupId,
        main_keyword: kw.mainKeyword,
        mid: kw.mid ? Number(kw.mid) : null,  // 숫자로 변환하거나 null
        url: kw.url || null,
        keyword1: kw.keyword1 || null,
        keyword2: kw.keyword2 || null,
        keyword3: kw.keyword3 || null,
        description: kw.description || null,
        is_active: kw.isActive !== undefined ? kw.isActive : true
      }));

      const { data, error } = await supabase
        .from('keywords')
        .insert(keywordsToInsert)
        .select('*');

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data.map(item => ({
        id: item.id,
        groupId: item.group_id,
        mainKeyword: item.main_keyword,
        mid: item.mid,
        url: item.url,
        keyword1: item.keyword1,
        keyword2: item.keyword2,
        keyword3: item.keyword3,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 대량 추가하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 이동
  async moveKeywords(keywordIds: number[], targetGroupId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 대상 그룹이 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', targetGroupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '대상 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 키워드들이 사용자의 것인지 확인
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('keywords')
        .select('*, keyword_groups!inner(user_id)')
        .in('id', keywordIds)
        .eq('keyword_groups.user_id', user.id);

      if (keywordsError || !keywordsData || keywordsData.length !== keywordIds.length) {
        return {
          success: false,
          message: '일부 키워드에 접근할 권한이 없습니다.',
        };
      }

      // 키워드 이동 (그룹 ID 업데이트)
      const { error } = await supabase
        .from('keywords')
        .update({ 
          group_id: targetGroupId,
          updated_at: new Date().toISOString()
        })
        .in('id', keywordIds);

      if (error) throw error;

      return { 
        success: true, 
        message: `${keywordIds.length}개의 키워드를 이동했습니다.`
      };
    } catch (error) {
      console.error('moveKeywords error:', error);
      return {
        success: false,
        message: '키워드를 이동하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 복사
  async copyKeywords(keywordIds: number[], targetGroupId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 대상 그룹이 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', targetGroupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '대상 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 원본 키워드 데이터 가져오기
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('keywords')
        .select('*, keyword_groups!inner(user_id)')
        .in('id', keywordIds)
        .eq('keyword_groups.user_id', user.id);

      if (keywordsError || !keywordsData || keywordsData.length !== keywordIds.length) {
        return {
          success: false,
          message: '일부 키워드에 접근할 권한이 없습니다.',
        };
      }

      // 복사할 키워드 데이터 준비
      const keywordsToCopy = keywordsData.map(kw => ({
        group_id: targetGroupId,
        main_keyword: kw.main_keyword,
        mid: kw.mid,
        url: kw.url,
        keyword1: kw.keyword1,
        keyword2: kw.keyword2,
        keyword3: kw.keyword3,
        description: kw.description,
        is_active: kw.is_active
      }));

      // 키워드 복사 (새로 추가)
      const { error } = await supabase
        .from('keywords')
        .insert(keywordsToCopy);

      if (error) throw error;

      return { 
        success: true, 
        message: `${keywordIds.length}개의 키워드를 복사했습니다.`
      };
    } catch (error) {
      console.error('copyKeywords error:', error);
      return {
        success: false,
        message: '키워드를 복사하는 중 오류가 발생했습니다.',
      };
    }
  }
};